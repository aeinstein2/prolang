-- Seed data for ProLang MVP
-- Note: This creates profiles with placeholder UUIDs for demo purposes
-- In production, these would be created via Supabase Auth

-- Insert glossary terms
INSERT INTO public.glossary_terms (source_term, translated_term, source_language, target_language, notes) VALUES
  ('Certificate of Incorporation', 'Байгуулагдсаны гэрчилгээ', 'en', 'mn', 'Legal document term'),
  ('Power of Attorney', 'Итгэмжлэл', 'en', 'mn', 'Legal document term'),
  ('Affidavit', 'Тангаргийн мэдүүлэг', 'en', 'mn', 'Legal document term'),
  ('Notarized', 'Нотариатаар баталгаажуулсан', 'en', 'mn', 'Certification type'),
  ('Apostille', 'Апостиль', 'en', 'mn', 'International certification'),
  ('Birth Certificate', 'Төрсний гэрчилгээ', 'en', 'mn', 'Identity document'),
  ('Marriage Certificate', 'Гэрлэлтийн гэрчилгээ', 'en', 'mn', 'Identity document'),
  ('Passport', 'Гадаад паспорт', 'en', 'mn', 'Identity document'),
  ('Certified Translation', 'Баталгаажуулсан орчуулга', 'en', 'mn', 'Service type'),
  ('Translation Memory', 'Орчуулгын санах ой', 'en', 'mn', 'Technical term'),
  ('акт', 'act / deed', 'mn', 'en', 'Legal document'),
  ('гэрээ', 'contract / agreement', 'mn', 'en', 'Legal document'),
  ('дүрэм', 'regulation / charter', 'mn', 'en', 'Legal document');
