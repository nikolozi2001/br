import React, { memo } from "react";
import PropTypes from "prop-types";
import loaderIcon from "../../assets/images/equalizer.svg";

// Optimized LoadingSpinner component with React.memo
const LoadingSpinner = memo(({ message }) => (
  <div className="bg-white rounded-lg shadow-lg p-8">
    <div className="flex justify-center items-center">
      <img src={loaderIcon} alt="Loading..." className="w-12 h-12" />
      <span className="ml-3 text-gray-600 font-bpg-nino">{message}</span>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';
LoadingSpinner.propTypes = {
  message: PropTypes.string.isRequired,
};

export default LoadingSpinner;
