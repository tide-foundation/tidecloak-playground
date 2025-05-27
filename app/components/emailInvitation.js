import { FaEnvelope, FaMinus, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";

/**
 * This component is displayed when demo user has not been linked to a Tide-account yet after initialization.
 * @return {JSX.Element} - HTML component of the invitation to link to Tide account
 */
export default function EmailInvitation({ inviteLink }) {

    const router = useRouter();

  return (
    <div className="fixed inset-0 bg-gray-200 flex items-center justify-center px-4 py-8 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 rounded-t-lg" style={{
          background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)'
        }}>
          <FaEnvelope className="text-white text-xl" />
          <div className="flex gap-2">
            <FaMinus className="text-white opacity-50" />
            <FaTimes className="text-white opacity-50" />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="text-sm text-gray-500 font-semibold">Subject</div>
          <div className="font-bold text-lg">Invitation to Play App</div>

          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            <p>Dear Human,<br />&nbsp;</p>
            <p>You’ve been invited to connect as the <strong><i>demo user</i></strong> for the Play app.<br />&nbsp;</p>
            <p>Create or connect your Tide account by clicking <strong><i>Accept</i></strong> below and following the prompts.<br />&nbsp;</p>
            <p>A Tide account allows you to login to any service with guaranteed privacy and ownership of your identity.</p>
          </div>

          <div>
            <button
              onClick={() => router.push(inviteLink)}
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 mt-4 rounded transition"
            >
              Accept
            </button>
                        <p className="text-sm italic text-gray-600 mt-3">
              Once you’re done you’ll be redirected to the Play app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}