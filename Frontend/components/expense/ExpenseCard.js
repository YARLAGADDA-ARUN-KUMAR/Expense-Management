import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  approved: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  rejected: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function ExpenseCard({ expense, onApprove, onReject, showActions = false }) {
  const statusInfo = statusConfig[expense.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300 border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{expense.category}</h3>
                <p className="text-sm text-slate-500 mt-1">{expense.description}</p>
              </div>
            </div>
            <Badge className={${statusInfo.color} border flex items-center gap-1}>
              <StatusIcon className="w-3 h-3" />
              {expense.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Amount:</span>
              <span className="font-semibold text-slate-900">
                {expense.currency} {expense.amount?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Date:</span>
              <span className="font-semibold text-slate-900">
                {format(new Date(expense.date), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {expense.receipt_url && (
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <FileText className="w-4 h-4" />
              View Receipt
            </a>
          )}

          {showActions && expense.status === "pending" && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onApprove(expense)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReject(expense)}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}