export default function PianoTile({ note, active, color, onClick, disabled }) {
    return (
      <button
        className={`w-16 h-24 ${
          active ? `bg-${color}-500` : 'bg-white'
        } border border-gray-300 rounded-md shadow-md transition-colors duration-300`}
        onClick={onClick}
        disabled={disabled}
      >
        {note}
      </button>
    );
  }