import {
    FaDiscord,
    FaLinkedin,
    FaGithub,
    FaExclamationCircle,
} from "react-icons/fa";

import { SiX } from "react-icons/si"; // Modern X (formerly Twitter) icon

export default function Footer(){
    return (
        <footer className="mt-auto p-4 bg-gray-100 flex flex-col md:flex-row justify-between items-center text-sm gap-2 md:gap-0">

        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
          <p>
            Secured by{" "}
            <a href="https://tide.org/tidecloak_product" className="text-blue-600 underline" target="_blank">TideCloak</a>
          </p>
          <a
            href="https://tide.org/beta"
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-blue-500 transition"
            target="_blank"
          >
            Join the Beta program
          </a>
        </div>
        <div className="flex gap-4 text-xl">
          <a
            href="https://discord.gg/XBMd9ny2q5"
            aria-label="Discord"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaDiscord />
          </a>
          <a
            href="https://twitter.com/tidefoundation"
            aria-label="X (formerly Twitter)"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <SiX />
          </a>
          <a
            href="https://www.linkedin.com/company/tide-foundation/"
            aria-label="LinkedIn"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://github.com/tide-foundation/tidecloakspaces"
            aria-label="GitHub"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaGithub />
          </a>
        </div>
      </footer>
    )
}