import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import PersonalInfo from "@/pages/PersonalInfo";
import PersonalInfoFixed from "@/pages/PersonalInfoFixed";
import IncomePage from "@/pages/Income-fixed";
import AdditionalIncomePage from "@/pages/AdditionalIncome-simple";
import AdditionalAdjustmentsPage from "@/pages/AdditionalAdjustments-simple";
import RetirementContributions from "@/pages/RetirementContributions";
import Deductions from "@/pages/Deductions";
import SALTDeductions from "@/pages/SALTDeductionsNew";
import TaxCredits from "@/pages/TaxCredits3";
import AdditionalTax from "@/pages/AdditionalTax";
import StateTax from "@/pages/StateTax";
import Review from "@/pages/Review";
import TaxSavingAdvice from "@/pages/TaxSavingAdvice";
import TaxSavings from "@/pages/TaxSavings";
import ExpertConsultation from "@/pages/ExpertConsultation";
import ExpertConsultationByState from "@/pages/ExpertConsultationByState";
import RetirementScore from "@/pages/RetirementScore";
import PricingPage from "@/pages/PricingPage";
import ApplicationForm from "@/pages/ApplicationForm";
import About from "@/pages/About";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ChangePassword from "@/pages/ChangePassword";
import ResetPassword from "@/pages/ResetPassword";
import DataTester from "@/pages/DataTester";
import CapitalGainsCalculator from "@/pages/CapitalGainsCalculator";
import QBIDetails from "@/pages/QBIDetails";
import BusinessExpense from "@/pages/BusinessExpense";
import PremiumFeatures from "@/pages/PremiumFeatures";
import Payment from "@/pages/Payment";
import FilingStatusChecker from "@/pages/FilingStatusChecker";
import ResidencyChecker from "@/pages/ResidencyChecker";
import SocialSecurityCalculator from "@/pages/SocialSecurityCalculator";
import Board from "@/pages/Board";
import BoardDetail from "@/pages/BoardDetail";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { TaxProvider } from "@/context/TaxContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { usePageTracking } from "@/hooks/usePageTracking";

function Router() {
  usePageTracking();
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/about" component={About} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPassword} />
      <ProtectedRoute path="/change-password" component={ChangePassword} />
      <Route path="/personal-info" component={PersonalInfo} />
      <ProtectedRoute path="/personal-info-old" component={PersonalInfo} />
      <Route path="/income" component={IncomePage} />
      <ProtectedRoute path="/qbi-details" component={QBIDetails} />
      <ProtectedRoute path="/business-expense" component={BusinessExpense} />
      <ProtectedRoute path="/capital-gains" component={CapitalGainsCalculator} />
      <ProtectedRoute path="/premium-features" component={PremiumFeatures} />
      <ProtectedRoute path="/payment" component={Payment} />
      <ProtectedRoute path="/filing-status-checker" component={FilingStatusChecker} />
      <Route path="/residency-checker" component={ResidencyChecker} />
      <Route path="/social-security-calculator" component={SocialSecurityCalculator} />
      <Route path="/board" component={Board} />
      <Route path="/board/:id" component={BoardDetail} />
      <ProtectedRoute path="/additional-income" component={AdditionalIncomePage} />
      <ProtectedRoute path="/additional-adjustments" component={AdditionalAdjustmentsPage} />
      <Route path="/retirement-contributions" component={RetirementContributions} />
      <Route path="/deductions" component={Deductions} />
      <ProtectedRoute path="/salt-deductions" component={SALTDeductions} />
      <Route path="/tax-credits" component={TaxCredits} />
      <Route path="/additional-tax" component={AdditionalTax} />
      <ProtectedRoute path="/state-tax" component={StateTax} />
      <ProtectedRoute path="/retirement-score" component={RetirementScore} />
      <Route path="/review" component={Review} />
      <Route path="/tax-savings" component={TaxSavings} />
      <ProtectedRoute path="/tax-saving-advice" component={TaxSavingAdvice} />
      <ProtectedRoute path="/expert-consultation" component={ExpertConsultation} />
      <Route path="/expert-consultation/:state" component={ExpertConsultationByState} />
      <ProtectedRoute path="/pricing" component={PricingPage} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <Route path="/application" component={ApplicationForm} />
      <ProtectedRoute path="/test-data" component={DataTester} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaxProvider>
          <LanguageProvider>
            <TooltipProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="py-8 flex-grow">
                  <Router />
                </main>
                <Footer />
              </div>
              <Toaster />
            </TooltipProvider>
          </LanguageProvider>
        </TaxProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
