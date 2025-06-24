import Select from "react-select";
import { selectStyles } from "../../utils/selectStyles";

function CustomSelect({ 
  placeholder, 
  value, 
  onChange, 
  options, 
  isMulti = false,
  isClearable = true,
  className = ""
}) {
  return (
    <Select
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      isMulti={isMulti}
      isClearable={isClearable}
      className={`react-select-container ${className}`}
      classNamePrefix="react-select"
      styles={selectStyles}
    />
  );
}

export default CustomSelect;
