export function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => resolve(null),
    );
  });
}
