import math
import hashlib
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any
from app.models.product import ProductListing
from app.schemas.consumer import MandiComparisonData


class PricingFreshnessService:
    """Calculates real-time biological freshness degradation and Mandi price arbitrage."""

    @staticmethod
    def calculate_freshness(
        harvest_timestamp: datetime,
        shelf_life_hours: int = 72,
        decay_lambda: float = 0.015,
        reference_time: Optional[datetime] = None,
        expected_delivery_hours: float = 2.0
    ) -> Tuple[float, float, str]:
        """
        Calculates freshness using biological exponential decay:
            Freshness(t) = 100 * exp(-lambda * t)
        where:
            t = (time since harvest) + (expected delivery time for consumer)
            to proactively account for and avoid spoilage of harvest during transit.

        Returns:
            (hours_since_harvest, freshness_score_0_to_100, freshness_label)
        """
        if reference_time is None:
            reference_time = datetime.now(timezone.utc)
            
        # Ensure harvest_timestamp is timezone-aware
        if harvest_timestamp.tzinfo is None:
            harvest_timestamp = harvest_timestamp.replace(tzinfo=timezone.utc)
            
        delta = reference_time - harvest_timestamp
        hours_since_harvest = max(0.0, delta.total_seconds() / 3600.0)
        
        # t = elapsed time since harvest + expected delivery time for consumer to avoid transit spoilage
        delivery_transit_hours = max(0.0, float(expected_delivery_hours))
        t = hours_since_harvest + delivery_transit_hours
        
        # Exponential degradation formula: Score = 100 * exp(-lambda * t)
        score = 100.0 * math.exp(-decay_lambda * t)
        
        # Shelf life hard boundary adjustment
        if t > shelf_life_hours:
            score = max(0.0, score * 0.5)
            
        score = round(max(0.0, min(100.0, score)), 1)
        
        if score >= 90:
            label = "Ultra Farm-Fresh (< 6 hrs post-harvest)"
        elif score >= 75:
            label = "Crisp & Fresh (< 24 hrs)"
        elif score >= 50:
            label = "Good Standard Quality"
        elif score >= 25:
            label = "Fair (Recommended for immediate cooking)"
        else:
            label = "Near Expiry / Processing Grade"
            
        return round(hours_since_harvest, 1), score, label

    @staticmethod
    def calculate_freshness_breakdown(
        harvest_timestamp: datetime,
        shelf_life_hours: int = 72,
        decay_lambda: float = 0.015,
        expected_delivery_hours: float = 2.0,
        reference_time: Optional[datetime] = None
    ) -> dict:
        """Detailed breakdown for consumer transparency and transit spoilage prevention audit."""
        if reference_time is None:
            reference_time = datetime.now(timezone.utc)
        if harvest_timestamp.tzinfo is None:
            harvest_timestamp = harvest_timestamp.replace(tzinfo=timezone.utc)
        delta = reference_time - harvest_timestamp
        hours_since_harvest = max(0.0, delta.total_seconds() / 3600.0)
        delivery_transit_hours = max(0.0, float(expected_delivery_hours))
        t = hours_since_harvest + delivery_transit_hours
        score = 100.0 * math.exp(-decay_lambda * t)
        if t > shelf_life_hours:
            score = max(0.0, score * 0.5)
        score = round(max(0.0, min(100.0, score)), 1)
        return {
            "hours_since_harvest": round(hours_since_harvest, 1),
            "expected_delivery_hours": round(delivery_transit_hours, 1),
            "total_decay_time_t": round(t, 1),
            "decay_lambda": decay_lambda,
            "freshness_score": score,
            "shelf_life_hours": shelf_life_hours,
            "spoilage_prevented": True
        }

    @staticmethod
    def compare_with_mandi(
        platform_price_per_kg: float,
        mandi_modal_price_per_kg: float,
        mandi_name: str
    ) -> MandiComparisonData:
        """
        In traditional APMC mandis, intermediaries add a 35-50% retail markup,
        while the farmer receives only a fraction of the modal price.
        Direct platform pricing saves consumer money while increasing net farmer realization.
        """
        # Estimated retail Mandi street price with 45% middleman retail markup
        estimated_retail_mandi_price = round(mandi_modal_price_per_kg * 1.45, 2)
        
        savings_percent = 0.0
        if estimated_retail_mandi_price > 0:
            savings_diff = estimated_retail_mandi_price - platform_price_per_kg
            savings_percent = round((savings_diff / estimated_retail_mandi_price) * 100.0, 1)
            
        # Farmer gain over raw APMC farmgate realization
        farmer_gain_percent = 0.0
        if mandi_modal_price_per_kg > 0:
            gain_diff = platform_price_per_kg - (mandi_modal_price_per_kg * 0.88)
            farmer_gain_percent = round((gain_diff / mandi_modal_price_per_kg) * 100.0, 1)
            
        return MandiComparisonData(
            mandi_name=mandi_name,
            mandi_modal_price_per_kg=round(mandi_modal_price_per_kg, 2),
            estimated_retail_price_per_kg=estimated_retail_mandi_price,
            platform_price_per_kg=round(platform_price_per_kg, 2),
            consumer_savings_percent=max(0.0, savings_percent),
            farmer_margin_gain_percent=max(0.0, farmer_gain_percent),
            is_better_deal=platform_price_per_kg <= estimated_retail_mandi_price
        )

    @staticmethod
    def calculate_daily_dynamic_price(
        base_price: float,
        crop_name: str,
        pricing_strategy: str = "DYNAMIC_MANDI_PEG",
        min_price_floor: Optional[float] = None,
        target_date: Optional[datetime] = None,
        category: Optional[str] = None
    ) -> Tuple[float, float, str]:
        """
        Stock-market style daily price fluctuation algorithm for harvest commodities.
        
        If pricing_strategy is 'FIXED_PRICE':
            Returns (round(base_price, 2), 0.0, 'STABLE')
            
        If pricing_strategy is 'DYNAMIC_MANDI_PEG':
            Calculates daily market swing factor based on date and crop arrival rhythms.
            Applies farmer's guaranteed Minimum Price Floor (MSP) if configured.
            
        Returns:
            (effective_price_per_kg, daily_change_percent, trend: 'UP'|'DOWN'|'STABLE')
        """
        base_price = float(base_price)
        if base_price <= 0:
            base_price = 10.0

        if pricing_strategy == "FIXED_PRICE":
            return round(base_price, 2), 0.0, "STABLE"

        if target_date is None:
            target_date = datetime.now(timezone.utc)
        elif target_date.tzinfo is None:
            target_date = target_date.replace(tzinfo=timezone.utc)

        date_str = target_date.strftime("%Y-%m-%d")
        seed_str = f"{date_str}:{crop_name.strip().lower()}"
        hash_val = int(hashlib.md5(seed_str.encode("utf-8")).hexdigest()[:8], 16)

        cat_str = str(category).upper() if category else ""
        if "VEGETABLE" in cat_str or "FRUIT" in cat_str:
            max_swing = 0.065  # ±6.5% daily volatility
        else:
            max_swing = 0.040  # ±4.0% daily volatility

        normalized = (hash_val % 1000) / 1000.0  # 0.0 to 0.999
        swing_percent = (normalized * 2.0 - 1.0) * max_swing

        weekday = target_date.weekday()
        if weekday in (5, 6, 0):  # Weekend to Monday high consumer volume
            swing_percent += 0.015
        elif weekday in (2, 3):  # Midweek APMC mandi arrival peak
            swing_percent -= 0.012

        unconstrained_price = round(base_price * (1.0 + swing_percent), 2)

        # Enforce farmer minimum price floor (MSP)
        effective_price = unconstrained_price
        if min_price_floor is not None and min_price_floor > 0:
            effective_price = max(float(min_price_floor), effective_price)

        effective_price = round(max(1.0, effective_price), 2)
        daily_change_pct = round(((effective_price - base_price) / base_price) * 100.0, 1)

        if daily_change_pct > 0.1:
            trend = "UP"
        elif daily_change_pct < -0.1:
            trend = "DOWN"
        else:
            trend = "STABLE"

        return effective_price, daily_change_pct, trend

    @staticmethod
    def calculate_market_high_profit_share(
        base_price: float,
        pricing_strategy: str = "DYNAMIC_MANDI_PEG",
        mandi_market_price: Optional[float] = None,
        market_surge_inr: Optional[float] = None,
        harvest_quantity_kg: float = 500.0,
        profit_share_percent: float = 20.0,
        min_price_floor: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculates farmer payout and high-market surge profit sharing (at 20% upside bonus):
        - If FIXED_PRICE: Farmer payout is strictly locked at base_price. No surge bonus is captured.
        - If DYNAMIC_MANDI_PEG:
            - When market is HIGH (mandi_market_price > base_price or market_surge_inr > 0):
              Farmer captures 20% of the market surge on top of base target rate:
              farmer_profit_share_per_kg = round(surge * (profit_share_percent / 100.0), 2)
              final_farmer_payout_per_kg = round(base_price + farmer_profit_share_per_kg, 2)
            - Protected by min_price_floor if market dips.
        """
        base_price = max(1.0, float(base_price))
        harvest_quantity_kg = max(0.1, float(harvest_quantity_kg))
        profit_share_percent = max(0.0, min(100.0, float(profit_share_percent)))

        if market_surge_inr is not None:
            surge = max(0.0, float(market_surge_inr))
            mandi_price = round(base_price + surge, 2)
        elif mandi_market_price is not None:
            mandi_price = max(base_price, float(mandi_market_price))
            surge = max(0.0, round(mandi_price - base_price, 2))
        else:
            surge = 10.0  # Default benchmark surge scenario (+₹10/kg)
            mandi_price = round(base_price + surge, 2)

        is_fixed = (pricing_strategy == "FIXED_PRICE")
        is_market_high = (surge > 0.0)

        if is_fixed:
            farmer_bonus_per_kg = 0.0
            final_payout_per_kg = round(base_price, 2)
            extra_profit_inr = 0.0
            effective_gain_pct = 0.0
            scenario_summary = (
                f"🔒 Fixed Price Model: Your rate is locked at ₹{base_price:.2f}/kg. "
                f"Even though APMC Mandi prices surged by +₹{surge:.2f}/kg (reaching ₹{mandi_price:.2f}/kg), "
                f"you receive no surge share (missing out on ₹{(surge * (profit_share_percent/100.0) * harvest_quantity_kg):.2f} extra profit)."
            )
            explanation = "Fixed pricing offers absolute price certainty, but does not capture windfall gains during market demand spikes."
        else:
            if is_market_high:
                farmer_bonus_per_kg = round(surge * (profit_share_percent / 100.0), 2)
                final_payout_per_kg = round(base_price + farmer_bonus_per_kg, 2)
                extra_profit_inr = round(farmer_bonus_per_kg * harvest_quantity_kg, 2)
                effective_gain_pct = round((farmer_bonus_per_kg / base_price) * 100.0, 1)
                scenario_summary = (
                    f"🚀 High-Market Profit Share Active (+{profit_share_percent:.0f}% Surge Share): "
                    f"APMC Mandi wholesale price spiked by +₹{surge:.2f}/kg to ₹{mandi_price:.2f}/kg. "
                    f"You automatically receive +₹{farmer_bonus_per_kg:.2f}/kg extra bonus payout, "
                    f"boosting your farmgate payout from ₹{base_price:.2f}/kg to ₹{final_payout_per_kg:.2f}/kg "
                    f"(+₹{extra_profit_inr:.2f} extra cash profit for {harvest_quantity_kg:.0f}kg lot)!"
                )
                explanation = (
                    f"Under TAZA Dynamic Pricing, farmers capture {profit_share_percent:.0f}% of market upside spikes directly, "
                    f"while consumers still pay ₹{round(mandi_price - final_payout_per_kg, 2):.2f}/kg less than street mandi rates."
                )
            else:
                farmer_bonus_per_kg = 0.0
                final_payout_per_kg = round(base_price, 2)
                extra_profit_inr = 0.0
                effective_gain_pct = 0.0
                scenario_summary = f"📊 Normal Market Day: Produce trading at baseline target rate of ₹{base_price:.2f}/kg."
                explanation = "Market is in equilibrium. Minimum Price Floor (MSP) protects your downside if prices fall."

        if min_price_floor is not None and min_price_floor > final_payout_per_kg:
            final_payout_per_kg = float(min_price_floor)

        base_total_payout = round(base_price * harvest_quantity_kg, 2)
        total_farmer_payout = round(final_payout_per_kg * harvest_quantity_kg, 2)
        consumer_saving_vs_mandi = max(0.0, round(mandi_price - final_payout_per_kg, 2))

        return {
            "pricing_strategy": pricing_strategy,
            "market_state": "HIGH_SURGE" if is_market_high else "NORMAL",
            "base_price_per_kg": round(base_price, 2),
            "mandi_benchmark_price_per_kg": round(mandi_price, 2),
            "market_surge_inr": round(surge, 2),
            "farmer_profit_share_percent": profit_share_percent,
            "farmer_profit_share_per_kg": farmer_bonus_per_kg,
            "final_farmer_payout_per_kg": final_payout_per_kg,
            "effective_gain_percent": effective_gain_pct,
            "harvest_quantity_kg": round(harvest_quantity_kg, 2),
            "base_total_payout_inr": base_total_payout,
            "extra_farmer_profit_inr": extra_profit_inr,
            "total_farmer_payout_inr": total_farmer_payout,
            "consumer_saving_vs_mandi_inr": consumer_saving_vs_mandi,
            "scenario_summary": scenario_summary,
            "explanation": explanation
        }


pricing_freshness_service = PricingFreshnessService()
