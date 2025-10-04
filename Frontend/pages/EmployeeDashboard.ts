import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Expense } from "@/entities/Expense";
import { ExpenseApproval } from "@/entities/ExpenseApproval";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, text: "Pending" },
  approved: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, text: "Approved" },
  rejected: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, text: "Rejected" },
};

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const currentUser = await User.me();
    setUser(currentUser);

    const [expenseData, approvalData] = await Promise.all([
      Expense.filter({ created_by: currentUser.email }, "-created_date"),
      ExpenseApproval.list()
    ]);

    setExpenses(expenseData);
    setApprovals(approvalData);
    setIsLoading(false);
  };

  const getApprovalStatus = (expense) => {
    const expenseApprovals = approvals.filter(a => a.expense_id === expense.id);
    if (expenseApprovals.length === 0) return "Pending initial review";
    
    const approved = expenseApprovals.filter(a => a.status === "approved").length;
    return ${approved} approval(s);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Employee Dashboard</h1>
            <p className="text-slate-600">Submit and track your expenses</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("SubmitExpense"))}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Submit Expense
          </Button>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="w-6 h-6 text-blue-600" />
              My Expenses ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-900 mb-2">No expenses yet</p>
                <p className="text-slate-500 mb-6">Submit your first expense to get started</p>
                <Button onClick={() => navigate(createPageUrl("SubmitExpense"))}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Expense
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Approvals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => {
                      const statusInfo = statusConfig[expense.status];
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <motion.tr
                          key={expense.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <TableCell className="font-medium text-slate-900">
                            {expense.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            {expense.currency} {expense.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={${statusInfo.color} border flex items-center gap-1 w-fit}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {getApprovalStatus(expense)}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}  employeedashboard