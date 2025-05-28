import React from 'react';
import './App.css';
import AddCandidateForm from './components/AddCandidateForm';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Seguimiento de Candidatos (ATS)</h1>
      </header>
      <main>
        <AddCandidateForm />
      </main>
    </div>
  );
}

export default App;
