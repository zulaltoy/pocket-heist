import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h2 className="form-title">Signup for an Account</h2>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
