import React, { useState } from "react";

interface PinPopupProps {
  onClose: () => void;
  onSubmit: (pin: string) => void;
}

const PinPopup: React.FC<PinPopupProps> = ({ onClose, onSubmit }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (pin === "202") {
      onSubmit(pin);
    } else {
      setError("Incorrect PIN. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Enter PIN</h2>
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={3}
          className="border p-2 rounded w-full mb-4"
        />
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-300 p-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinPopup;
