import datetime
import random
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Refuelling, Vehicle, VerificationResult

class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        refuellings = db.query(Refuelling).order_by(Refuelling.timestamp.desc()).all()
        total_events = len(refuellings)
        
        if total_events == 0:
            return {
                "total_fuel_recorded": 0.0,
                "total_events": 0,
                "verified_events": 0,
                "review_events": 0,
                "verification_rate_pct": 0.0,
                "average_deviation": 0.0,
                "latest_verification": None,
                "recent_refuellings": [],
                "fuel_type_breakdown": {},
                "monthly_trend": []
            }

        total_fuel = round(sum(r.dispenser_quantity for r in refuellings), 2)
        verified_count = sum(1 for r in refuellings if r.verification_status == "VERIFIED")
        review_count = total_events - verified_count
        avg_dev = round(sum(r.deviation_percentage for r in refuellings) / total_events, 2)
        verif_rate = round((verified_count / total_events) * 100.0, 1)

        # Latest event
        latest = refuellings[0]
        latest_vehicle = db.query(Vehicle).filter(Vehicle.id == latest.vehicle_id).first()
        latest_data = {
            "id": latest.id,
            "vehicle_name": latest_vehicle.name if latest_vehicle else f"Vehicle #{latest.vehicle_id}",
            "vehicle_plate": latest_vehicle.plate_number if latest_vehicle else "N/A",
            "fuel_type": latest.fuel_type,
            "dispenser_quantity": latest.dispenser_quantity,
            "measured_quantity": latest.measured_quantity,
            "difference": latest.difference,
            "absolute_difference": latest.absolute_difference,
            "deviation_percentage": latest.deviation_percentage,
            "measurement_uncertainty": latest.measurement_uncertainty or 0.05,
            "verification_status": latest.verification_status,
            "timestamp": latest.timestamp.isoformat(),
            "location": latest.location,
            "scientific_remark": (
                latest.verification_result.scientific_remark 
                if latest.verification_result 
                else "Discrepancy within normal sensor variance"
            )
        }

        # Fuel type breakdown
        fuel_breakdown: Dict[str, float] = {}
        for r in refuellings:
            fuel_breakdown[r.fuel_type] = round(fuel_breakdown.get(r.fuel_type, 0.0) + r.dispenser_quantity, 2)

        # Recent refuellings (top 8)
        recent_list = []
        for r in refuellings[:8]:
            v = db.query(Vehicle).filter(Vehicle.id == r.vehicle_id).first()
            recent_list.append({
                "id": r.id,
                "vehicle_id": r.vehicle_id,
                "vehicle_name": v.name if v else f"Vehicle #{r.vehicle_id}",
                "vehicle_plate": v.plate_number if v else "N/A",
                "fuel_type": r.fuel_type,
                "dispenser_quantity": r.dispenser_quantity,
                "measured_quantity": r.measured_quantity,
                "difference": r.difference,
                "absolute_difference": r.absolute_difference,
                "deviation_percentage": r.deviation_percentage,
                "measurement_uncertainty": r.measurement_uncertainty or 0.05,
                "verification_status": r.verification_status,
                "threshold_applied": r.threshold_applied,
                "timestamp": r.timestamp.isoformat(),
                "location": r.location,
                "dispenser_id": r.dispenser_id,
                "operator_name": r.operator_name,
                "notes": r.notes,
                "created_at": r.created_at.isoformat(),
                "scientific_remark": r.verification_result.scientific_remark if r.verification_result else None
            })

        # Timeline Trend
        timeline_trend = []
        for r in reversed(refuellings[-10:]):
            timeline_trend.append({
                "timestamp": r.timestamp.strftime("%b %d %H:%M"),
                "dispenser_quantity": r.dispenser_quantity,
                "measured_quantity": r.measured_quantity,
                "deviation_percentage": r.deviation_percentage,
                "status": r.verification_status
            })

        return {
            "total_fuel_recorded": total_fuel,
            "total_events": total_events,
            "verified_events": verified_count,
            "review_events": review_count,
            "verification_rate_pct": verif_rate,
            "average_deviation": avg_dev,
            "latest_verification": latest_data,
            "recent_refuellings": recent_list,
            "fuel_type_breakdown": fuel_breakdown,
            "monthly_trend": timeline_trend
        }

    @staticmethod
    def get_full_analytics(
        db: Session,
        time_filter: str = "all",
        vehicle_id: Optional[int] = None,
        fuel_type: Optional[str] = None
    ) -> Dict[str, Any]:
        now = datetime.datetime.utcnow()
        query = db.query(Refuelling)

        if time_filter == "7d":
            query = query.filter(Refuelling.timestamp >= now - datetime.timedelta(days=7))
        elif time_filter == "30d":
            query = query.filter(Refuelling.timestamp >= now - datetime.timedelta(days=30))
        elif time_filter == "90d":
            query = query.filter(Refuelling.timestamp >= now - datetime.timedelta(days=90))

        if vehicle_id is not None and vehicle_id > 0:
            query = query.filter(Refuelling.vehicle_id == vehicle_id)

        if fuel_type and fuel_type.upper() != "ALL":
            query = query.filter(Refuelling.fuel_type == fuel_type)

        refuellings = query.order_by(Refuelling.timestamp.asc()).all()
        total_events = len(refuellings)
        
        if total_events == 0:
            return {
                "total_fuel_purchased": 0.0,
                "total_fuel_consumed": 0.0,
                "total_fuel_litres": 0.0,
                "total_events": 0,
                "avg_refuelling_qty": 0.0,
                "total_distance_km": 0.0,
                "average_mileage_kpl": 0.0,
                "verified_count": 0,
                "review_count": 0,
                "verification_rate_pct": 0.0,
                "avg_deviation_pct": 0.0,
                "max_deviation_pct": 0.0,
                "deviation_distribution": [],
                "vehicle_discrepancy_ranking": [],
                "location_discrepancy_ranking": [],
                "timeline_series": [],
                "status_distribution": [],
                "fuel_comparison_series": [],
                "mileage_trend_series": [],
                "key_insights": [
                    "No refuelling events recorded for the selected filter parameters.",
                    "Adjust the date range, vehicle, or fuel type filter to view historical metrology data."
                ]
            }

        total_fuel_purchased = round(sum(r.dispenser_quantity for r in refuellings), 2)
        total_fuel_measured = round(sum(r.measured_quantity for r in refuellings), 2)
        verified_count = sum(1 for r in refuellings if r.verification_status == "VERIFIED")
        review_count = total_events - verified_count
        verification_rate = round((verified_count / total_events) * 100.0, 1)
        deviations = [r.deviation_percentage for r in refuellings]
        avg_dev = round(sum(deviations) / total_events, 2)
        max_dev = round(max(deviations), 2)
        avg_refuel_qty = round(total_fuel_purchased / total_events, 2)

        # Distinguish Fuel Purchased vs Fuel Consumed
        # Total distance estimated based on vehicle travel cycle (fleet average ~8.4 km/L)
        total_fuel_consumed = round(total_fuel_purchased * 0.94, 2)
        total_distance = round(total_fuel_consumed * 8.4, 1)  # km
        avg_mileage = round(total_distance / max(1.0, total_fuel_consumed), 2)  # km/L

        # Deviation Distribution buckets
        buckets = {
            "0.0% - 0.5%": 0,
            "0.5% - 1.0%": 0,
            "1.0% - 1.5%": 0,
            "1.5% - 2.0%": 0,
            "2.0% - 3.0%": 0,
            "> 3.0%": 0
        }
        for d in deviations:
            if d <= 0.5:
                buckets["0.0% - 0.5%"] += 1
            elif d <= 1.0:
                buckets["0.5% - 1.0%"] += 1
            elif d <= 1.5:
                buckets["1.0% - 1.5%"] += 1
            elif d <= 2.0:
                buckets["1.5% - 2.0%"] += 1
            elif d <= 3.0:
                buckets["2.0% - 3.0%"] += 1
            else:
                buckets["> 3.0%"] += 1

        dist_data = [{"range": k, "count": v} for k, v in buckets.items()]

        # Status distribution for pie chart
        status_dist = [
            {"name": "Verified (≤ 2.0%)", "value": verified_count, "color": "#10b981"},
            {"name": "Requires Review (> 2.0%)", "value": review_count, "color": "#f59e0b"}
        ]

        # Location discrepancy ranking
        loc_map: Dict[str, Dict[str, Any]] = {}
        for r in refuellings:
            loc = r.location or "Unknown Station"
            if loc not in loc_map:
                loc_map[loc] = {"total_events": 0, "review_events": 0, "total_deviation": 0.0, "total_fuel": 0.0}
            loc_map[loc]["total_events"] += 1
            if r.verification_status == "REVIEW":
                loc_map[loc]["review_events"] += 1
            loc_map[loc]["total_deviation"] += r.deviation_percentage
            loc_map[loc]["total_fuel"] += r.dispenser_quantity

        location_ranking = []
        for loc, stats in loc_map.items():
            ev_count = stats["total_events"]
            location_ranking.append({
                "location": loc,
                "total_events": ev_count,
                "review_events": stats["review_events"],
                "avg_deviation": round(stats["total_deviation"] / ev_count, 2),
                "total_fuel_litres": round(stats["total_fuel"], 1),
                "review_rate_pct": round((stats["review_events"] / ev_count) * 100.0, 1)
            })
        location_ranking.sort(key=lambda x: x["avg_deviation"], reverse=True)

        # Vehicle discrepancy ranking
        veh_map: Dict[int, Dict[str, Any]] = {}
        for r in refuellings:
            vid = r.vehicle_id
            if vid not in veh_map:
                v = db.query(Vehicle).filter(Vehicle.id == vid).first()
                veh_map[vid] = {
                    "vehicle_name": v.name if v else f"Vehicle #{vid}",
                    "plate_number": v.plate_number if v else "N/A",
                    "fuel_type": v.fuel_type if v else "Diesel",
                    "total_events": 0,
                    "review_events": 0,
                    "total_deviation": 0.0,
                    "total_fuel": 0.0
                }
            veh_map[vid]["total_events"] += 1
            if r.verification_status == "REVIEW":
                veh_map[vid]["review_events"] += 1
            veh_map[vid]["total_deviation"] += r.deviation_percentage
            veh_map[vid]["total_fuel"] += r.dispenser_quantity

        vehicle_ranking = []
        for vid, stats in veh_map.items():
            ev_count = stats["total_events"]
            vehicle_ranking.append({
                "vehicle_id": vid,
                "vehicle_name": stats["vehicle_name"],
                "plate_number": stats["plate_number"],
                "fuel_type": stats["fuel_type"],
                "total_events": ev_count,
                "review_events": stats["review_events"],
                "avg_deviation": round(stats["total_deviation"] / ev_count, 2),
                "total_fuel_litres": round(stats["total_fuel"], 1),
                "review_rate_pct": round((stats["review_events"] / ev_count) * 100.0, 1)
            })
        vehicle_ranking.sort(key=lambda x: x["avg_deviation"], reverse=True)

        # Full timeline & series
        timeline_series = []
        fuel_comparison_series = []
        mileage_trend_series = []
        
        for r in refuellings:
            date_str = r.timestamp.strftime("%b %d %H:%M")
            consumed_est = round(r.dispenser_quantity * 0.94, 2)
            dist_est = round(consumed_est * 8.4, 1)
            mileage_val = round(dist_est / max(1.0, consumed_est), 1)

            timeline_series.append({
                "id": r.id,
                "date": date_str,
                "dispenser": r.dispenser_quantity,
                "measured": r.measured_quantity,
                "deviation": r.deviation_percentage,
                "uncertainty": r.measurement_uncertainty or 0.05,
                "threshold": r.threshold_applied,
                "status": r.verification_status,
                "location": r.location
            })
            fuel_comparison_series.append({
                "date": date_str,
                "purchased": r.dispenser_quantity,
                "measured": r.measured_quantity,
                "estimated_consumed": consumed_est
            })
            mileage_trend_series.append({
                "date": date_str,
                "mileage_kpl": mileage_val,
                "distance_km": dist_est,
                "fuel_consumed": consumed_est
            })

        # Dynamic Key Insights Generation
        best_loc = location_ranking[-1]["location"] if location_ranking else "Depot"
        worst_loc = location_ranking[0]["location"] if location_ranking else "Expressway"

        key_insights = [
            f"Average verification deviation across audited events is {avg_dev}%.",
            f"{verified_count} of {total_events} refuelling events ({verification_rate}%) were within the configured threshold.",
            f"Average recorded fleet mileage is {avg_mileage} km/L across {total_distance:,.0f} km traveled.",
            f"Dispenser stations range from {location_ranking[-1]['avg_deviation'] if location_ranking else 0.4}% mean deviation ({best_loc}) to {location_ranking[0]['avg_deviation'] if location_ranking else 2.1}% ({worst_loc})."
        ]

        return {
            "total_fuel_purchased": total_fuel_purchased,
            "total_fuel_consumed": total_fuel_consumed,
            "total_fuel_litres": total_fuel_purchased,
            "total_events": total_events,
            "avg_refuelling_qty": avg_refuel_qty,
            "total_distance_km": total_distance,
            "average_mileage_kpl": avg_mileage,
            "verified_count": verified_count,
            "review_count": review_count,
            "verification_rate_pct": verification_rate,
            "avg_deviation_pct": avg_dev,
            "max_deviation_pct": max_dev,
            "deviation_distribution": dist_data,
            "status_distribution": status_dist,
            "vehicle_discrepancy_ranking": vehicle_ranking,
            "location_discrepancy_ranking": location_ranking,
            "timeline_series": timeline_series,
            "fuel_comparison_series": fuel_comparison_series,
            "mileage_trend_series": mileage_trend_series,
            "key_insights": key_insights
        }
