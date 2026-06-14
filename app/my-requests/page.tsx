import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmManualPaymentButton } from "@/components/confirm-manual-payment-button";
import { CompletePaymentButton } from "@/components/complete-payment-button";
import { MyRequestsSuccessHandler } from "@/components/my-requests-success-handler";
import { PaymentInstructionsCard } from "@/components/payment-instructions-card";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import {
  getPaymentInstructions,
  isPaidCheckoutAvailable
} from "@/lib/payment-instructions";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES
} from "@/lib/request-status-labels";
import { createClient } from "@/lib/supabase/server";
import { getMyRequests } from "@/lib/supabase/requests";
type MyRequestsPageProps = {
  searchParams: {
    paid?: string;
    free_promo?: string;
    payment_cancelled?: string;
    payment_pending?: string;
  };
};

export default async function MyRequestsPage({
  searchParams
}: MyRequestsPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my-requests");
  }

  const { requests, error } = await getMyRequests(user.id);
  const paymentInstructions = getPaymentInstructions();
  const paidCheckoutAvailable = isPaidCheckoutAvailable();
  const showPaidSuccess = searchParams.paid === "1";
  const showFreePromoSuccess = searchParams.free_promo === "1";

  return (
    <section className="page-container space-y-8">
      <MyRequestsSuccessHandler
        showPaid={showPaidSuccess}
        showFreePromo={showFreePromoSuccess}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-section text-3xl sm:text-4xl">My requests</h1>
          <p className="mt-3 text-body">
            Track the requests you posted — see status and read answers here.
          </p>
        </div>
        <Link href="/post-request" className="btn-primary shrink-0">
          Post a new request
        </Link>
      </div>

      {searchParams.payment_cancelled === "1" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Payment was cancelled. Complete payment below to publish your request.
        </p>
      )}

      {searchParams.payment_pending === "1" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your request is saved. Tap <strong>Confirm payment</strong> below —
          your request will go live for Peeks once payment is marked as received.
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {requests.length === 0 ? (
        <article className="card-static border-2 border-dashed border-zinc-200 text-center">
          <p className="font-semibold text-peek-text">No requests yet</p>
          <p className="mt-2 text-body">
            Post something you need checked nearby — a Peek can pick it up.
          </p>
          <Link href="/post-request" className="btn-primary mt-6 inline-flex">
            Post a request
          </Link>
        </article>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${REQUEST_STATUS_STYLES[request.status]}`}
                    >
                      {REQUEST_STATUS_LABELS[request.status]}
                    </span>
                    {request.payment?.status && (
                      <PaymentStatusBadge
                        status={request.payment.status}
                        provider={request.payment.payment_provider}
                      />
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-peek-text">
                    {request.title}
                  </h2>
                  <p className="mt-1 text-body">{request.location}</p>
                </div>
                <p className="text-xl font-bold text-peek-accent">
                  £{request.budget}
                </p>
              </div>

              {request.payment?.status === "pending" &&
                request.payment.payment_provider === "manual" &&
                !paidCheckoutAvailable && (
                  <ConfirmManualPaymentButton
                    requestId={request.id}
                    amount={request.payment.amount}
                    currency={request.payment.currency}
                  />
                )}

              {request.payment?.status === "pending" &&
                request.payment.payment_provider === "manual" &&
                paidCheckoutAvailable &&
                paymentInstructions && (
                  <div className="mt-4">
                    <PaymentInstructionsCard
                      amount={request.payment.amount}
                      currency={request.payment.currency}
                      requestTitle={request.title}
                      instructions={paymentInstructions}
                    />
                  </div>
                )}

              {request.payment?.status === "pending" &&
                request.payment.payment_provider === "manual" &&
                paidCheckoutAvailable &&
                !paymentInstructions && (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Payment is required before this request goes live. Payment
                    details are not set up yet — please contact Peek support.
                  </p>
                )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <p className="text-sm text-peek-muted capitalize">
                  Status: {request.status}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {request.payment?.status === "pending" &&
                    (request.payment.payment_provider === "stripe" ||
                      request.payment.payment_provider === "paypal") && (
                    <CompletePaymentButton
                      requestId={request.id}
                      provider={request.payment.payment_provider}
                    />
                  )}
                  <Link
                    href={`/requests/${request.id}`}
                    className="btn-secondary px-5 py-2 text-sm"
                  >
                    {request.status === "completed"
                      ? "View answer"
                      : "View details"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
