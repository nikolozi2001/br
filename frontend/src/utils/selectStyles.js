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
    // Bold the "select group" action rows (values used only in the legal-form dropdown)
    fontWeight:
      state.data?.value === "__select_all__" ||
      state.data?.value === "__select_business__"
        ? 700
        : "normal",
    "&:hover": {
      backgroundColor: state.isSelected
        ? "#0080BE"
        : "#E6F4FA",
    },
  }),
  groupHeading: (base) => ({
    ...base,
    color: "#0080BE",
    fontWeight: 700,
    fontSize: "0.8rem",
    textTransform: "none",
    borderTop: "1px solid #E5E7EB",
    paddingTop: "8px",
    marginTop: "2px",
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
