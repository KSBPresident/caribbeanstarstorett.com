CREATE INDEX IF NOT EXISTS purchase_requests_requester_user_idx
  ON public.purchase_requests (requester_user_id);
CREATE INDEX IF NOT EXISTS seller_applications_applicant_user_idx
  ON public.seller_applications (applicant_user_id);
