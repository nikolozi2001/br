const API_BASE_URL = 'http://localhost:5000/api';

// Legal Forms API
export const fetchLegalForms = async (lang) => {
  try {
    const response = await fetch(`${API_BASE_URL}/legal-forms?lang=${lang}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.map((form) => ({
      value: form.ID.toString(),
      label: form.Abbreviation + " - " + form.Legal_Form,
    }));
  } catch (error) {
    console.error("Error fetching legal forms:", error);
    throw error;
  }
};

// You can add more API calls here as needed
export const API = {
  fetchLegalForms,
};

export default API;
