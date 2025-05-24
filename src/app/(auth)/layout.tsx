import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="group">
            <div className="flex items-center space-x-3 transition-transform group-hover:scale-105">
              <Image
                // src="/pomolink_icon.svg"
                src="/icon_trimmed.png"
                alt="PomoLink"
                width={36}
                height={36}
                className="w-12 h-12"
              />
              {/* <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PomoLink
              </h1> */}
              <Image
                src="/pomolink_text_trimmed.png"
                alt="PomoLink"
                width={140}
                height={40}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              />
            </div>
          </Link>
          {/* <Link
            href="/"
            className="p-6 flex items-center justify-center relative min-h-20 cursor-pointer group hover:scale-110  transition-transform"
          >
            <Image
              src="/icon_trimmed.png"
              alt="PomoLink"
              width={40}
              height={40}
              className="absolute left-6  transition-transform"
            />
            <Image
              src="/pomolink_text_trimmed.png"
              alt="PomoLink"
              width={140}
              height={40}
              className="absolute top-9 left-18  transition-transform"
            />
          </Link> */}

          <p className="text-center text-sm text-gray-600 max-w-sm">
            集中力を高め、目標を達成するためのポモドーロタイマーアプリ
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm px-6 py-8 shadow-xl ring-1 ring-gray-200/50 sm:rounded-2xl sm:px-10 border-0">
          {children}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 PomoLink. すべての権利を保有します。
        </p>
      </div>
    </div>
  );
}
