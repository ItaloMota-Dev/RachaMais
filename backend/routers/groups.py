from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from auth import get_current_user
from database import get_session
from logic import calculate_group_balances, simplify_debts
from models import Group, GroupCreate, GroupMember, GroupRead, User, UserRead

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("/", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: GroupCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    group = Group(name=group_in.name, category_icon=group_in.category_icon)
    session.add(group)
    session.commit()
    session.refresh(group)

    # Add creator + requested members
    member_ids = set(group_in.member_ids) | {current_user.id}
    for uid in member_ids:
        session.add(GroupMember(group_id=group.id, user_id=uid))
    session.commit()
    return group


@router.get("/", response_model=List[GroupRead])
def list_groups(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    links = session.exec(
        select(GroupMember).where(GroupMember.user_id == current_user.id)
    ).all()
    group_ids = [lnk.group_id for lnk in links]
    groups = [session.get(Group, gid) for gid in group_ids]
    return [g for g in groups if g is not None]


@router.get("/{group_id}", response_model=GroupRead)
def get_group(group_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/{group_id}/members", response_model=List[UserRead])
def get_members(group_id: int, session: Session = Depends(get_session)):
    links = session.exec(
        select(GroupMember).where(GroupMember.group_id == group_id)
    ).all()
    members = [session.get(User, lnk.user_id) for lnk in links]
    return [m for m in members if m is not None]


@router.get("/{group_id}/dashboard")
def get_dashboard(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    from models import Expense

    expenses = session.exec(
        select(Expense).where(Expense.group_id == group_id)
    ).all()
    total_expenses = round(sum(e.amount for e in expenses), 2)

    balances = calculate_group_balances(group_id, session)
    my_balance = balances.get(current_user.id, 0.0)
    total_to_receive = round(sum(v for v in balances.values() if v > 0), 2)
    total_to_pay = round(sum(-v for v in balances.values() if v < 0), 2)

    settlements = simplify_debts(balances)

    # Enrich with names
    def name_of(uid: int) -> str:
        u = session.get(User, uid)
        return u.name if u else str(uid)

    enriched = [
        {
            "from_user": name_of(s["from_user"]),
            "to_user": name_of(s["to_user"]),
            "amount": s["amount"],
        }
        for s in settlements
    ]

    return {
        "total_expenses": total_expenses,
        "my_balance": my_balance,
        "total_to_receive": total_to_receive,
        "total_to_pay": total_to_pay,
        "simplified_settlements": enriched,
    }
