import React, { memo } from "react";
import PropTypes from "prop-types";

// Optimized EmptyState component with React.memo
const EmptyState = memo(({ message }) => (
  <div className="bg-white rounded-lg shadow-lg p-8">
    <p className="text-center text-gray-600 font-bpg-nino">{message}</p>
  </div>
));

EmptyState.displayName = 'EmptyState';
EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
};

export default EmptyState;
