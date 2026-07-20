import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Vibe CRM <onboarding@resend.dev>",
      to: [email],
      subject: "Tu código para restablecer la contraseña — Vibe CRM",
      text: `Tu código para restablecer la contraseña es: ${token}\n\nSi no lo solicitaste, ignora este email.`,
    });
    if (error) {
      throw new Error("No se pudo enviar el email de recuperación");
    }
  },
});
