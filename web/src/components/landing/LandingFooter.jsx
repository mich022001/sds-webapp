import { SDS_LOGO } from "../../lib/sdsData";

export default function LandingFooter() {
  return (
    <footer className="bg-gray-950 py-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col items-center gap-5 text-center">

          <div className="flex items-center gap-3">
            <img
              src={SDS_LOGO}
              alt="SDS"
              className="h-12 w-12 object-contain"
            />

            <div className="text-left">
              <div className="text-lg font-bold text-white">
                SDS
              </div>

              <div className="text-sm font-medium text-yellow-400">
                Sure-Fit Wellness
              </div>
            </div>
          </div>


          <div className="max-w-md text-sm leading-relaxed text-gray-400">
            Building wellness and income opportunities across the Philippines
            through products, memberships, and direct sales operations.
          </div>


          <div className="w-full border-t border-gray-800 pt-5 text-xs text-gray-500">
            © {new Date().getFullYear()} SDS Sure-Fit Wellness
          </div>

        </div>

      </div>
    </footer>
  );
}
