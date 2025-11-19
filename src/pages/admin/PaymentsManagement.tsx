import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Download, X } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: string;
  amount: number;
  status: string;
  created_at: string;
  razorpay_payment_id: string;
}

const PaymentsManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, payments, statusFilter, planFilter, startDate, endDate]);

  const fetchPayments = async () => {
    const { data: subsData } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!subsData) {
      setLoading(false);
      return;
    }

    const paymentsWithUsers = await Promise.all(
      subsData.map(async (sub) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', sub.user_id)
          .single();

        return {
          id: sub.id,
          user_id: sub.user_id,
          user_name: profileData?.full_name || "N/A",
          user_email: profileData?.email || "N/A",
          plan_type: sub.plan_type,
          amount: Number(sub.amount),
          status: sub.status,
          created_at: sub.created_at,
          razorpay_payment_id: sub.razorpay_payment_id || "N/A",
        };
      })
    );

    setPayments(paymentsWithUsers);
    setFilteredPayments(paymentsWithUsers);
    setLoading(false);
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.razorpay_payment_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter((payment) => payment.plan_type === planFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(
        (payment) => new Date(payment.created_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (payment) => new Date(payment.created_at) <= new Date(endDate + "T23:59:59")
      );
    }

    setFilteredPayments(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPlanFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const exportToCSV = () => {
    const headers = ["Payment ID", "User Name", "Email", "Plan", "Amount", "Status", "Date"];
    const csvData = filteredPayments.map((payment) => [
      payment.razorpay_payment_id,
      payment.user_name,
      payment.user_email,
      getPlanName(payment.plan_type),
      payment.amount,
      payment.status.toUpperCase(),
      format(new Date(payment.created_at), "MMM dd, yyyy HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlanColor = (planType: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800",
      monthly: "bg-blue-100 text-blue-800",
      annual: "bg-green-100 text-green-800",
      enterprise: "bg-purple-100 text-purple-800",
    };
    return colors[planType] || colors.free;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      trial: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.trial;
  };

  const getPlanName = (planType: string) => {
    const names: Record<string, string> = {
      free: "Free",
      monthly: "Monthly ₹50",
      annual: "Yearly ₹2000",
      enterprise: "Enterprise",
    };
    return names[planType] || planType;
  };

  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payments Management</h1>
          <p className="text-muted-foreground">View all payment transactions</p>
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPayments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, email, or payment ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                  className="w-full lg:w-[180px]"
                />

                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                  className="w-full lg:w-[180px]"
                />

                {(searchTerm || statusFilter !== "all" || planFilter !== "all" || startDate || endDate) && (
                  <Button onClick={clearFilters} variant="ghost" className="gap-2">
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.razorpay_payment_id.substring(0, 20)}...
                      </TableCell>
                      <TableCell className="font-medium">{payment.user_name}</TableCell>
                      <TableCell>{payment.user_email}</TableCell>
                      <TableCell>
                        <Badge className={getPlanColor(payment.plan_type)}>
                          {getPlanName(payment.plan_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentsManagement;
