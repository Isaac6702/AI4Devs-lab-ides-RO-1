import React, { useState, ChangeEvent, FormEvent } from 'react';

// Interfaz para los datos del formulario
interface CandidateFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  workExperience: string;
}

// Interfaz para los errores de validación
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  cv?: string;
}

const AddCandidateForm: React.FC = () => {
  const [formData, setFormData] = useState<CandidateFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    education: '',
    workExperience: '',
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    // Limpiar error del campo al modificarlo
    if (errors[name as keyof FormErrors]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      if (errors.cv) {
        setErrors(prevErrors => ({ ...prevErrors, cv: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio.';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio.';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del correo electrónico no es válido.';
    }
    // Validación del tipo de archivo (opcional aquí, ya que el backend también valida)
    if (cvFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(cvFile.type)) {
        newErrors.cv = 'Tipo de archivo no válido. Solo se permiten PDF y DOCX.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    const submissionData = new FormData();
    submissionData.append('firstName', formData.firstName);
    submissionData.append('lastName', formData.lastName);
    submissionData.append('email', formData.email);
    submissionData.append('phone', formData.phone);
    submissionData.append('address', formData.address);
    submissionData.append('education', formData.education);
    submissionData.append('workExperience', formData.workExperience);

    if (cvFile) {
      submissionData.append('cv', cvFile);
    }

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        body: submissionData,
        // No establecer 'Content-Type': 'multipart/form-data', el navegador lo hace automáticamente con FormData
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccessMessage('¡Candidato añadido exitosamente!');
        // Resetear formulario
        setFormData({
          firstName: '', lastName: '', email: '', phone: '',
          address: '', education: '', workExperience: '',
        });
        setCvFile(null);
        if (e.target instanceof HTMLFormElement) e.target.reset(); // Para limpiar el input file
      } else {
        setErrorMessage(responseData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setErrorMessage('Error de conexión o del servidor. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Añadir Nuevo Candidato</h2>

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <div>
        <label htmlFor="firstName">Nombre:</label>
        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
        {errors.firstName && <p style={{ color: 'red' }}>{errors.firstName}</p>}
      </div>

      <div>
        <label htmlFor="lastName">Apellido:</label>
        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
        {errors.lastName && <p style={{ color: 'red' }}>{errors.lastName}</p>}
      </div>

      <div>
        <label htmlFor="email">Correo Electrónico:</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
        {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone">Teléfono:</label>
        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="address">Dirección:</label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="education">Educación:</label>
        <textarea id="education" name="education" value={formData.education} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="workExperience">Experiencia Laboral:</label>
        <textarea id="workExperience" name="workExperience" value={formData.workExperience} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="cv">CV (PDF o DOCX):</label>
        <input type="file" id="cv" name="cv" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
        {errors.cv && <p style={{ color: 'red' }}>{errors.cv}</p>}
      </div>

      <button type="submit">Añadir Candidato</button>
    </form>
  );
};

export default AddCandidateForm;

