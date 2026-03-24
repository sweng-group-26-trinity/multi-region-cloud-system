import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../api/auth";

type Props = {
  onSuccess?: () => void;
};

export default function GoogleSignInButton({ onSuccess }: Props) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Missing VITE_GOOGLE_CLIENT_ID");
      return;
    }

    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        try {
          if (!response.credential) {
            throw new Error("No Google credential returned");
          }

          const data = await loginWithGoogle({
            idToken: response.credential,
          });

          localStorage.setItem("token", data.accessToken);
          localStorage.setItem("user", JSON.stringify(data.user));

          onSuccess?.();
          navigate("/dashboard");
        } catch (error) {
          console.error("Google sign-in failed:", error);
          alert("Google sign-in failed");
        }
      },
    });

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 260,
    });
  }, [navigate, onSuccess]);

  return <div ref={buttonRef} />;
}
