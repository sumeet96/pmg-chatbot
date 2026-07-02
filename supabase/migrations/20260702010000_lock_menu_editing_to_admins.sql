/*
  # Lock menu editing to admins only

  Previously any authenticated user could insert/update/delete menu_items.
  This restricts all write operations to users whose profile has
  is_admin = true. Viewing the menu remains open to everyone.

  Admin is checked via a subquery against profiles (same pattern already
  used by the complaints policies); no recursion since it is cross-table.
*/

-- Remove the previous permissive write policies (any name they may have had)
DROP POLICY IF EXISTS "Authenticated can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can delete menu items" ON public.menu_items;

-- Admin-only INSERT (rows are still stamped with the creator)
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

-- Admin-only UPDATE
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- Admin-only DELETE
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));
