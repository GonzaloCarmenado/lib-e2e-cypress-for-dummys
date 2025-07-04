// Estilos personalizados para SweetAlert2 usados por la librería E2E Cypress for Dummys
export const LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES = `
.swal2-container, .swal2-popup {
  z-index: 99999 !important;
}
.swal2-popup {
  background: #181c24 !important;
  color: #fff !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid #232a3a !important;
  padding: 0 !important;
  min-width: 400px;
  max-width: 90vw;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.swal2-title {
  color: #2196f3 !important;
  font-weight: bold;
  font-size: 1.05rem;
  background: #181c24;
  border-radius: 12px 12px 0 0;
  padding: 10px 18px 6px 18px;
  margin-bottom: 0 !important;
  border-bottom: 1px solid #181c24;
}
.swal2-close {
  color: #fff !important;
  font-size: 1.5rem !important;
  top: 12px !important;
  right: 16px !important;
  z-index: 1!important;
}
.swal2-html-container {
  background: #181c24;
  border-radius: 0 0 12px 12px;
  padding: 0 12px 12px 12px !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  overflow: auto;
}
`;
