export type Landmark = {
    id: number;
    name: string;
    location: string;
    isOpen: boolean;
};
export type Quest = {
    id: number;
    title: string;
    steps: string[];
    reward: string;
};