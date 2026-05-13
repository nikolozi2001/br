export const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#0080BE" : "#D1D5DB",
    "&:hover": {
      borderColor: "#0080BE",
    },
    boxShadow: "none",
    padding: "1px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1F2937",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#4B5563",
  }),
  input: (base) => ({
    ...base,
    color: "#1F2937",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#0080BE"
      : state.isFocused
      ? "#E6F4FA"
      : "white",
    color: state.isSelected ? "white" : "#000000",
    "&:hover": {
      backgroundColor: state.isSelected
        ? "#0080BE"
        : "#E6F4FA",
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#E6F4FA",
    borderRadius: "4px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#0080BE",
    fontWeight: "bold",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#0080BE",
    "&:hover": {
      backgroundColor: "#0080BE",
      color: "white",
    },
  }),
};
