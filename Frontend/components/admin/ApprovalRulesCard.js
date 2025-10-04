import React from "react";
import { ApprovalRule } from "@/entities/ApprovalRule";
import { Company } from "@/entities/Company";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function ApprovalRulesCard() {
  const [rules, setRules] = React.useState([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [company, setCompany] = React.useState(null);
  const [managers, setManagers] = React.useState([]);
  const [newRule, setNewRule] = React.useState({
    rule_type: "percentage",
    threshold_percentage: "",
    specific_approver_id: "",
    is_sequential: true,
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rulesData, companyData, users] = await Promise.all([
      ApprovalRule.list(),
      Company.list(),
      User.list(),
    ]);
    setRules(rulesData);
    setCompany(companyData[0]);
    setManagers(
      users.filter((u) => u.role === "manager" || u.role === "admin")
    );
  };

  const handleAddRule = async () => {
    if (!company) return;

    const ruleData = {
      company_id: company.id,
      rule_type: newRule.rule_type,
      threshold_percentage:
        newRule.rule_type === "percentage" || newRule.rule_type === "hybrid"
          ? parseFloat(newRule.threshold_percentage)
          : null,
      specific_approver_id:
        newRule.rule_type === "specific_approver" ||
        newRule.rule_type === "hybrid"
          ? newRule.specific_approver_id
          : null,
      is_sequential: newRule.is_sequential,
    };

    await ApprovalRule.create(ruleData);
    setNewRule({
      rule_type: "percentage",
      threshold_percentage: "",
      specific_approver_id: "",
      is_sequential: true,
    });
    setIsAdding(false);
    loadData();
  };

  const handleDeleteRule = async (ruleId) => {
    await ApprovalRule.delete(ruleId);
    loadData();
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Settings className="w-6 h-6 text-indigo-600" />
            Approval Rules
          </CardTitle>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {isAdding && (
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-4">
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={newRule.rule_type}
                onValueChange={(value) =>
                  setNewRule({ ...newRule, rule_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    Percentage Based (e.g., 60% of managers must approve)
                  </SelectItem>
                  <SelectItem value="specific_approver">
                    Specific Approver (e.g., CFO must approve)
                  </SelectItem>
                  <SelectItem value="hybrid">
                    Hybrid (Both percentage and specific approver)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newRule.rule_type === "percentage" ||
              newRule.rule_type === "hybrid") && (
              <div className="space-y-2">
                <Label>Threshold Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 60"
                  value={newRule.threshold_percentage}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      threshold_percentage: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-slate-500">
                  Percentage of managers who must approve (e.g., 60 means 60% of
                  managers)
                </p>
              </div>
            )}

            {(newRule.rule_type === "specific_approver" ||
              newRule.rule_type === "hybrid") && (
              <div className="space-y-2">
                <Label>Specific Approver (e.g., CFO)</Label>
                <Select
                  value={newRule.specific_approver_id}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, specific_approver_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name} ({manager.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sequential"
                checked={newRule.is_sequential}
                onCheckedChange={(checked) =>
                  setNewRule({ ...newRule, is_sequential: checked })
                }
              />
              <Label htmlFor="sequential" className="text-sm cursor-pointer">
                Sequential approval (direct manager must approve first)
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddRule}
                className="bg-green-600 hover:bg-green-700"
              >
                Save Rule
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No approval rules configured yet
            </p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 border border-slate-200 rounded-lg bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 mb-2">
                      {rule.rule_type.replace("_", " ").toUpperCase()}
                    </Badge>
                    <div className="space-y-1 text-sm">
                      {rule.threshold_percentage && (
                        <p className="text-slate-700">
                          <strong>Threshold:</strong>{" "}
                          {rule.threshold_percentage}% of managers must approve
                        </p>
                      )}
                      {rule.specific_approver_id && (
                        <p className="text-slate-700">
                          <strong>Specific Approver:</strong>{" "}
                          {
                            managers.find(
                              (m) => m.id === rule.specific_approver_id
                            )?.full_name
                          }
                        </p>
                      )}
                      {rule.is_sequential && (
                        <p className="text-slate-600">
                          ✓ Sequential approval enabled (direct manager first)
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
