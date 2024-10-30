<template>
    <div class="pdf-container">
      <embed :src="pdfUrl" type="application/pdf" width="100%" height="100%">
    </div>
  </template>
  
  <script>
  import cvPdf from '../data/CVNickWenzel.pdf'
  
  export default {
    data() {
      return {
        pdfUrl: cvPdf
      }
    }
  }
  </script>
  
  <style scoped>
  .pdf-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }
  </style>