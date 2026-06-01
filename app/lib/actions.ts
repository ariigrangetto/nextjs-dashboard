"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    //coerce funciona para convertir automaticamente un tipo de dato de entrada al tipo de dato que se espera de salida
    status: z.enum(["pending", "paid"]),
    date: z.string(),
});

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const CreateInvoice = FormSchema.omit({ id: true, date: true });
//omit crea un nuevo esquema a partir de un esquema ya existente, eliminando elementos especificos como en este caso el id y el date

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];


    await sql` INSERT INTO invoices (customer_id, amount, state, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");

};

//parse es la funcion principal que se utiliza para validar y asegurar que coincidan con un esquema especificado
//safeParse en cambio, devuelve un objeto con una propiedad success

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });
    const amountInCents = amount * 100;

    await sql`UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, state = ${status}
    WHERE id = ${id}`;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
};

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
}