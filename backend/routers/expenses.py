from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlmodel import Session, select

from auth import get_current_user
from database import get_session
from models import (
    Expense,
    ExpenseCreate,
    ExpenseRead,
    ExpenseSplit,
    ExpenseSplitCreate,
    User,
)
from services.ocr_service import extract_expense_from_image

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("/scan")
async def scan_expense(file: UploadFile = File(...)):
    """OCR endpoint: upload a receipt image and get structured expense data."""
    result = await extract_expense_from_image(file)
    return result


@router.post("/", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    expense = Expense(
        description=expense_in.description,
        amount=expense_in.amount,
        date=expense_in.date,
        group_id=expense_in.group_id,
        paid_by_id=expense_in.paid_by_id,
    )
    session.add(expense)
    session.commit()
    session.refresh(expense)

    # If no splits provided, split equally among all group members
    if expense_in.splits:
        for split_in in expense_in.splits:
            split = ExpenseSplit(
                expense_id=expense.id,
                user_id=split_in.user_id,
                value=split_in.value,
            )
            session.add(split)
    else:
        from models import GroupMember
        links = session.exec(
            select(GroupMember).where(GroupMember.group_id == expense_in.group_id)
        ).all()
        if links:
            equal_share = round(expense_in.amount / len(links), 2)
            for lnk in links:
                session.add(
                    ExpenseSplit(
                        expense_id=expense.id,
                        user_id=lnk.user_id,
                        value=equal_share,
                    )
                )

    session.commit()
    return expense


@router.get("/group/{group_id}", response_model=List[ExpenseRead])
def list_expenses_by_group(
    group_id: int,
    session: Session = Depends(get_session),
):
    expenses = session.exec(
        select(Expense).where(Expense.group_id == group_id)
    ).all()
    return expenses


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.paid_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this expense")
    session.delete(expense)
    session.commit()
