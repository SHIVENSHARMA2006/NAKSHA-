import hashlib
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import AuditLogEntry, GeometryModel

class AuditService:
    def __init__(self):
        self._entries: List[AuditLogEntry] = []
        self._latest_hash = "GENESIS_BLOCK_NAKSHA_CADASTRAL_CHAIN_0000000000000000"

    def record_action(
        self,
        parcel_code: str,
        actor: str,
        action: str,
        geom_before: Optional[GeometryModel],
        geom_after: Optional[GeometryModel],
        notes: Optional[str] = None
    ) -> AuditLogEntry:
        timestamp = datetime.now(timezone.utc)
        entry_id = f"AUD-{parcel_code}-{int(timestamp.timestamp()*1000)}"

        # Compute tamper-evident hash
        payload = {
            "entry_id": entry_id,
            "parcel_code": parcel_code,
            "actor": actor,
            "action": action,
            "notes": notes or "",
            "timestamp": timestamp.isoformat(),
            "prev_hash": self._latest_hash,
            "geom_before": geom_before.model_dump() if geom_before else None,
            "geom_after": geom_after.model_dump() if geom_after else None
        }
        hash_sig = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
        self._latest_hash = hash_sig

        entry = AuditLogEntry(
            id=entry_id,
            parcel_code=parcel_code,
            timestamp=timestamp,
            actor=actor,
            action=action,
            notes=notes,
            geom_before=geom_before,
            geom_after=geom_after,
            hash_signature=hash_sig
        )
        self._entries.append(entry)
        return entry

    def get_entries_for_parcel(self, parcel_code: str) -> List[AuditLogEntry]:
        return [e for e in self._entries if e.parcel_code == parcel_code]

    def get_all_entries(self, limit: int = 100) -> List[AuditLogEntry]:
        return list(reversed(self._entries[-limit:]))

# Global singleton
audit_service = AuditService()
