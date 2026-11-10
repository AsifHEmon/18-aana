import prodPunjabi from '../assets/images/prod_punjabi_1794333167580.jpg';
import prodSharee from '../assets/images/prod_sharee_1794333167873.jpg';
import prodFatua from '../assets/images/prod_fatua_1794333168695.jpg';
import prodKurti from '../assets/images/prod_kurti_1794333168744.jpg';
import prodShawl from '../assets/images/prod_shawl_1794333169063.jpg';
import prodFlannel from '../assets/images/prod_flannel_1794333169922.jpg';
import prodThreepiece from '../assets/images/prod_threepiece_1794333170042.jpg';
import catBags from '../assets/images/cat_bags_1794333170654.jpg';
import catJewelry from '../assets/images/cat_jewelry_1794333170803.jpg';
import catHomedecor from '../assets/images/cat_homedecor_1794333171263.jpg';

export const IMAGE_ASSET_MAP: Record<string, string> = {
  punjabi: prodPunjabi,
  sharee: prodSharee,
  fatua: prodFatua,
  kurti: prodKurti,
  shawl: prodShawl,
  flannel: prodFlannel,
  threepiece: prodThreepiece,
  bags: catBags,
  jewelry: catJewelry,
  homedecor: catHomedecor,
  men_dept: prodPunjabi,
  women_dept: prodSharee,
  kids_dept: prodFatua,
  denim: prodFlannel,
  shirt: prodFlannel,
  salwar: prodThreepiece,
  lungi: prodPunjabi,
};

export function resolveProductImage(keyOrUrl?: string | null): string {
  if (!keyOrUrl) return prodPunjabi;
  if (IMAGE_ASSET_MAP[keyOrUrl]) {
    return IMAGE_ASSET_MAP[keyOrUrl];
  }
  return keyOrUrl;
}

export function formatBDT(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString('en-US')}`;
}
