import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Company } from "@/entities/Company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

const FALLBACK_COUNTRIES = [
  { name: "United States", currency: "USD", code: "US" },
  { name: "United Kingdom", currency: "GBP", code: "GB" },
  { name: "Canada", currency: "CAD", code: "CA" },
  { name: "Australia", currency: "AUD", code: "AU" },
  { name: "Germany", currency: "EUR", code: "DE" },
  { name: "France", currency: "EUR", code: "FR" },
  { name: "Japan", currency: "JPY", code: "JP" },
  { name: "China", currency: "CNY", code: "CN" },
  { name: "India", currency: "INR", code: "IN" },
  { name: "Brazil", currency: "BRL", code: "BR" },
  { name: "Mexico", currency: "MXN", code: "MX" },
  { name: "Singapore", currency: "SGD", code: "SG" },
  { name: "Hong Kong", currency: "HKD", code: "HK" },
  { name: "Switzerland", currency: "CHF", code: "CH" },
  { name: "Sweden", currency: "SEK", code: "SE" },
  { name: "Norway", currency: "NOK", code: "NO" },
  { name: "Denmark", currency: "DKK", code: "DK" },
  { name: "Netherlands", currency: "EUR", code: "NL" },
  { name: "Spain", currency: "EUR", code: "ES" },
  { name: "Italy", currency: "EUR", code: "IT" },
];

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);
  const [companyData, setCompanyData] = useState({
    name: "",
    country: "",
    currency: "",
  });

  useEffect(() => {
    const redirectToDashboard = (role) => {
      if (role === "admin") navigate(createPageUrl("AdminDashboard"));
      else if (role === "manager") navigate(createPageUrl("ManagerDashboard"));
      else navigate(createPageUrl("EmployeeDashboard"));
    };

    const checkUserAndCompany = async () => {
      try {
        const user = await User.me();
        const companies = await Company.list();

        if (companies.length === 0 && user.role === "admin") {
          setShowCompanySetup(true);
        } else {
          redirectToDashboard(user.role);
        }
      } catch (error) {
        console.log("User not logged in");
      }
      setIsLoading(false);
    };

    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        const data = await response.json();

        if (Array.isArray(data)) {
          const countryList = data
            .map((country) => ({
              name: country.name.common,
              currency: Object.keys(country.currencies || {})[0] || "USD",
              code: country.cca2,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setCountries(countryList);
        } else {
          console.log("Using fallback countries list");
        }
      } catch (error) {
        console.log("Using fallback countries list due to API error");
      }
    };

    checkUserAndCompany();
    fetchCountries();
  }, [navigate]);

  const handleCompanySetup = async (e) => {
    e.preventDefault();
    const user = await User.me();

    await Company.create({
      name: companyData.name,
      country: companyData.country,
      default_currency: companyData.currency,
      admin_email: user.email,
    });

    const companies = await Company.list();
    await User.updateMyUserData({
      company_id: companies[0].id,
    });

    navigate(createPageUrl("AdminDashboard"));
  };

  const handleCountryChange = (countryName) => {
    const country = countries.find((c) => c.name === countryName);
    setCompanyData({
      ...companyData,
      country: countryName,
      currency: country?.currency || "USD",
    });
  };

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCompanySetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-none">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Company Setup
              </CardTitle>
              <p className="text-slate-500">1 admin user per company</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={companyData.name}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, name: e.target.value })
                    }
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country Selection</Label>
                  <select
                    id="country"
                    value={companyData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    required
                    className="w-full h-11 px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {companyData.currency && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Default Currency:</strong> {companyData.currency}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Complete Setup
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            ExpenseFlow
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Modern Expense Management for Growing Teams
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: Shield,
              title: "Role-Based Access",
              description:
                "Admin, Manager, and Employee roles with customized permissions",
            },
            {
              icon: TrendingUp,
              title: "Smart Approvals",
              description:
                "Configurable approval workflows with percentage-based and sequential rules",
            },
            {
              icon: Users,
              title: "Team Management",
              description: "Easy user management with manager hierarchies",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow border-none h-full">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
home;
