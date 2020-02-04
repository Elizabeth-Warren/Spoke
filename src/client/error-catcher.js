export default error => {
  if (!error) {
    console.error("Uncaught exception with null error object");
    return;
  }

  console.error(error);
};
