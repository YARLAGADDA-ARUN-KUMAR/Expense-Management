import React, { useEffect, useState } from "react";
import { Expense } from "@/entities/Expense";
import { ExpenseApproval } from "@/entities/ExpenseApproval";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ManagerDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [user, allUsers, allExpenses, approvals] = await Promise.all([
      User.me(),
      User.list(),
      Expense.list("-created_date"),
      ExpenseApproval.list(),
    ]);

    setCurrentUser(user);
    setUsers(allUsers);

    const myTeamExpenses = allExpenses.filter((expense) => {
      const creator = allUsers.find((u) => u.email === expense.created_by);
      return creator?.manager_id === user.id && expense.status === "pending";
    });

    const expensesNeedingApproval = myTeamExpenses.filter((expense) => {
      const hasMyApproval = approvals.some(
        (a) => a.expense_id === expense.id && a.approver_id === user.id
      );
      return !hasMyApproval;
    });

    setExpenses(allExpenses);
    setPendingExpenses(expensesNeedingApproval);
    setIsLoading(false);
  };

  const handleApprove = async (expense) => {
    await ExpenseApproval.create({
      expense_id: expense.id,
      approver_id: currentUser.id,
      status: "approved",
      comments: "Approved by manager",
      approval_date: new Date().toISOString(),
    });

    await Expense.update(expense.id, { status: "approved" });
    loadData();
  };

  const handleReject = async (expense) => {
    await ExpenseApproval.create({
      expense_id: expense.id,
      approver_id: currentUser.id,
      status: "rejected",
      comments: "Rejected by manager",
      approval_date: new Date().toISOString(),
    });

    await Expense.update(expense.id, { status: "rejected" });
    loadData();
  };

  const getRequestOwner = (expense) => {
    const creator = users.find((u) => u.email === expense.created_by);
    return creator?.full_name || expense.created_by;
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Manager Dashboard
          </h1>
          <p className="text-slate-600">Review and approve team expenses</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-green-50">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="w-6 h-6 text-green-600" />
              Approvals to Review ({pendingExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingExpenses.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-900 mb-2">
                  All caught up!
                </p>
                <p className="text-slate-500">
                  No pending approvals at the moment
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">
                        Request Owner
                      </TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">
                        Total Amount
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExpenses.map((expense) => (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-900">
                          {getRequestOwner(expense)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {expense.currency} {expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(expense)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(expense)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
