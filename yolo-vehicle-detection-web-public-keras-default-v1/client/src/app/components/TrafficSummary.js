const TrafficSummary = ({ vehicleData }) => {
  const countVehiclesByType = (data) => {
    return data.reduce((acc, { class: type }) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  };

  const vehicleCounts = countVehiclesByType(vehicleData);

  return (
    <div className="w-full h-full grid grid-cols-2 sm:grid-cols-2 gap-4">
      {Object.entries(vehicleCounts).map(([type, count]) => (
        <div
          key={type}
          className="bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8"
        >
          <div className="flex items-center justify-center">
            <div className="flex-shrink-0">
              <span className="text-2xl sm:text-3xl leading-none font-bold text-gray-900">
                {count}
              </span>
              <h3 className="text-base font-normal text-gray-500">{type}</h3>
            </div>
            {/* <div className="ml-5 w-0 flex items-center justify-end flex-1 text-green-500 text-base font-bold">
              14.6%
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrafficSummary;
