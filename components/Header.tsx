import Link from 'next/link';
import Image from 'next/image';
const Header = () => {
    return (
        <header className="bg-gray-100 py-2 border-t">
        <div className="flex items-center justify-between px-6">
          <Link href="/">
            <Image
              src="/campus-marketplacelogo.png"
              alt="Logo"
              width={128}
              height={128}
              className="h-12 w-auto"
            />
          </Link>
        </div>
        </header>
    )
}

export default Header;