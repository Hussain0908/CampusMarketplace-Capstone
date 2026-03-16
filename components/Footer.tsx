import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-100 py-3 relative before:absolute before:top-0 before:left-0 before:w-full before:h-3 before:bg-gradient-to-b before:from-gray-150 before:to-transparent'>
      <div className='mx-auto flex flex-col md:flex-row items-center justify-between px-6'>
        {/* Logo */}
        <div className='mb-4 md:mb-0'>
        <Link href="/">
            <Image
              src="/campus-marketplacelogo.png"
              alt="Logo"
              width={80}
              height={80}
              className="h-10 md:h-12 lg:h-14 w-auto"
            />
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav>
          <ul className='flex space-x-6 text-sm text-gray-600'>
            <li>
              <a href='/about' className='hover:text-gray-900 transition'>About</a>
            </li>
            <li>
              <a href='/contact' className='hover:text-gray-900 transition'>Contact</a>
            </li>
            <li>
              <a href='/privacy' className='hover:text-gray-900 transition'>Privacy Policy</a>
            </li>
          </ul>
        </nav>
        
        {/* Copyright */}
        <div className='text-sm text-gray-600 mt-4 md:mt-0'>
          &copy; {currentYear} Campus Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;