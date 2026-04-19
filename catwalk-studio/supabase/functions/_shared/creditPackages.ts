export async function getActiveCreditPackageById(supabase: any, packageId: string) {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('package_id, name, usd_amount, credits_amount, is_active, sort_order')
    .eq('package_id', packageId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
