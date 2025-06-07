import React from 'react';

interface MissingVulnerabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  vulnerabilities: string[]; // Lista de nomes de vulnerabilidades
}

const MissingVulnerabilitiesModal: React.FC<MissingVulnerabilitiesModalProps> = ({
  isOpen,
  onClose,
  title,
  vulnerabilities,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full m-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        {vulnerabilities.length > 0 ? (
          <ul className="list-disc list-inside h-64 overflow-y-auto mb-4 p-2 border rounded bg-gray-50">
            {vulnerabilities.map((vuln, index) => (
              <li key={index} className="text-gray-700">{vuln}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 mb-4">Nenhuma vulnerabilidade ausente.</p>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissingVulnerabilitiesModal;