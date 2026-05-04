from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from auth import get_current_user
from database import get_session
from models import Settlement, SettlementCreate, SettlementRead, User

router = APIRouter(prefix="/settlements", tags=["settlements"])


@router.post("/", response_model=SettlementRead, status_code=status.HTTP_201_CREATED)
def create_settlement(
    settlement_in: SettlementCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    settlement = Settlement(
        from_user=settlement_in.from_user,
        to_user=settlement_in.to_user,
        amount=settlement_in.amount,
        status=settlement_in.status,
    )
    session.add(settlement)
    session.commit()
    session.refresh(settlement)
    return settlement


@router.get("/", response_model=List[SettlementRead])
def list_settlements(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    settlements = session.exec(
        select(Settlement).where(
            (Settlement.from_user == current_user.id)
            | (Settlement.to_user == current_user.id)
        )
    ).all()
    return settlements


@router.patch("/{settlement_id}/complete", response_model=SettlementRead)
def complete_settlement(
    settlement_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    settlement = session.get(Settlement, settlement_id)
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if settlement.to_user != current_user.id:
        raise HTTPException(status_code=403, detail="Only the recipient can mark as complete")
    settlement.status = "completed"
    session.add(settlement)
    session.commit()
    session.refresh(settlement)
    return settlement
