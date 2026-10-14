export type ShipmentStop = {
  title: string;
  note: string;
  timeLabel: string;
};

export type ShipmentPreview = {
  id: string;
  origin: string;
  destination: string;
  distanceLabel: string;
  readyTrucksLabel: string;
  boardStatusLabel: string;
  cargoType: string;
  weightLabel: string;
  vehicleRequirement: string;
  pickup: ShipmentStop;
  dropoff: ShipmentStop;
  recentActivity: {
    name: string;
    detail: string;
  };
  illustrative: true;
};
