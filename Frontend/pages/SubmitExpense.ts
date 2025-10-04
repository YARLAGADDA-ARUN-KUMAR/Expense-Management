import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Expense } from "@/entities/Expense";
import { Company } from "@/entities/Company";
import { User } from "@/entities/User";
import { UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SubmitExpense() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [expenseData, setExpenseData] = useState({
    description: "",
    category: "",
    amount: "",
    currency: "",
    date: new Date().toISOString().split('T')[0],
    paid_by: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [companyData, userData] = await Promise.all([
      Company.list(),
      User.me()
    ]);
    
    if (companyData.length > 0) {
      setCompany(companyData[0]);
      setExpenseData(prev => ({
        ...prev,
        currency: companyData[0].default_currency,
        paid_by: userData.full_name
      }));
    }
    setUser(userData);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReceiptFile(file);
    setIsProcessing(true);

    try {
      const { file_url } = await UploadFile({ file });
      
      const result = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            amount: { type: "number" },
            date: { type: "string" },
            category: { type: "string" }
          }
        }
      });

      if (result.status === "success" && result.output) {
        setExpenseData(prev => ({
          ...prev,
          description: result.output.description || prev.description,
          amount: result.output.amount?.toString() || prev.amount,
          date: result.output.date || prev.date,
          category: result.output.category || prev.category,
          receipt_url: file_url
        }));
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
    }
    
    setIsProcessing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let conversionRate = 1;
      let originalCurrency = expenseData.currency;
      let convertedAmount = parseFloat(expenseData.amount);

      if (expenseData.currency !== company.default_currency) {
        const ratesResponse = await fetch(
          https://api.exchangerate-api.com/v4/latest/${expenseData.currency}
        );
        const ratesData = await ratesResponse.json();
        conversionRate = ratesData.rates[company.default_currency];
        convertedAmount = parseFloat(expenseData.amount) * conversionRate;
      }

      await Expense.create({
        company_id: company.id,
        employee_id: user.id,
        description: expenseData.description,
        category: expenseData.category,
        amount: convertedAmount,
        original_amount: parseFloat(expenseData.amount),
        currency: company.default_currency,
        original_currency: originalCurrency,
        conversion_rate: conversionRate,
        date: expenseData.date,
        paid_by: expenseData.paid_by,
        receipt_url: expenseData.receipt_url,
        status: "pending"
      });

      navigate(createPageUrl("EmployeeDashboard"));
    } catch (error) {
      console.error("Error submitting expense:", error);
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("EmployeeDashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Submit Expense</h1>
            <p className="text-slate-600">Create a new expense claim</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <CardTitle className="text-slate-900">Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt Upload (Optional - OCR Enabled)</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      id="receipt"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="receipt" className="cursor-pointer">
                      {isProcessing ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                          <p className="text-sm text-slate-600">Processing receipt...</p>
                        </div>
                      ) : receiptFile ? (
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-12 h-12 text-green-600" />
                          <p className="text-sm font-medium text-slate-900">{receiptFile.name}</p>
                          <p className="text-xs text-slate-500">Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="w-12 h-12 text-slate-400" />
                          <p className="text-sm text-slate-600">Click to upload receipt</p>
                          <p className="text-xs text-slate-400">PDF, PNG, JPG accepted</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter expense description"
                      value={expenseData.description}
                      onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={expenseData.category}
                      onValueChange={(value) => setExpenseData({...expenseData, category: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Accommodation">Accommodation</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Input
                      id="currency"
                      placeholder="USD"
                      value={expenseData.currency}
                      onChange={(e) => setExpenseData({...expenseData, currency: e.target.value.toUpperCase()})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={expenseData.date}
                      onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By *</Label>
                    <Input
                      id="paidBy"
                      placeholder="Your name"
                      value={expenseData.paid_by}
                      onChange={(e) => setExpenseData({...expenseData, paid_by: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {expenseData.currency && company && expenseData.currency !== company.default_currency && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Amount will be converted from {expenseData.currency} to {company.default_currency} using current exchange rates.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl("EmployeeDashboard"))}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Submit Expense"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} submit expense