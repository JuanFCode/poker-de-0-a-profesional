import { redirect } from "next/navigation";

/** La mesa se juega en la portada. Esta ruta se queda para los enlaces viejos. */
export default function JuegoPage() {
  redirect("/");
}
