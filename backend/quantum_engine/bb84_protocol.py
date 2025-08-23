#version 3 code with transmission log
import json
from qiskit import QuantumCircuit
from qiskit_aer import Aer
import numpy as np

class BB84Protocol:
    def __init__(self, KEY_LENGTH: int, is_eve_active: bool = False,noise_percent: int = 0):
        #REQUIREMENTS
        self.KEY_LENGTH = KEY_LENGTH
        self.is_eve_active = is_eve_active
        self.simulator = Aer.get_backend('qasm_simulator')
        self.noise_ratio = noise_percent / 100.0

        #RESULTS
        self.transmission_log = {}
        self.qber = 0.0
        self.corrected_key = []

        #AUXILIARY STORAGE
        self.alice_bits = self.__generate_random_sequence(KEY_LENGTH)
        self.alice_bases = self.__generate_random_sequence(KEY_LENGTH)
        self.bob_bases = self.__generate_random_sequence(KEY_LENGTH)
        self.bob_bits = np.zeros(KEY_LENGTH, dtype=int)
        self.eve_bases = None
        self.eve_bits = None
        if self.is_eve_active:
            self.eve_bases = self.__generate_random_sequence(KEY_LENGTH)
            self.eve_bits = np.zeros(KEY_LENGTH, dtype=int)
        

    def __generate_random_sequence(self, length):
        qc = QuantumCircuit(length,length)
        qc.h(range(length))
        qc.measure_all(add_bits=False)
        job = self.simulator.run(qc, shots = 1)
        result = list(job.result().get_counts())[0]
        return np.array([int(bit) for bit in result])
        
    def run_simulation(self):
        for i in range(self.KEY_LENGTH):
            # This is the original state from Alice
            original_alice_bit = self.alice_bits[i]
            original_alice_basis = self.alice_bases[i]
            log_entry = {'alice': {'bit': int(original_alice_bit), 'basis': 'X' if original_alice_basis == 1 else 'Z'}}
            
            bit_in_transit = original_alice_bit
            basis_in_transit = original_alice_basis

            if self.is_eve_active:
                eve_basis = self.eve_bases[i]
                eve_measured_bit = self.__simulate_measurement(bit_in_transit, basis_in_transit, eve_basis)
                self.eve_bits[i] = eve_measured_bit

                # Log the state that Eve resends
                log_entry['after_eve'] = {'bit': int(eve_measured_bit), 'basis': 'X' if eve_basis == 1 else 'Z'}
                # Indicates whether the bit animation should change or not Eve causes corruption
                log_entry['is_eve_flipped'] = bool((original_alice_bit != eve_measured_bit) or (original_alice_basis != eve_basis))
                
                # Eve resends the qubit with her results
                bit_in_transit = eve_measured_bit
                basis_in_transit = eve_basis
            else:
                # If no Eve, the state after Eve is the same as Alice's
                log_entry['after_eve'] = log_entry['alice'].copy()
                log_entry['is_eve_flipped'] = False

            log_entry['is_noise_flipped'] = False
            #Measuring By Bob
            bob_basis = self.bob_bases[i]
            bob_measured_bit = self.__simulate_measurement(bit_in_transit, basis_in_transit, bob_basis)
            self.bob_bits[i] = bob_measured_bit
            log_entry['bob'] = {'basis': 'X' if bob_basis == 1 else 'Z', 'measured_bit': int(bob_measured_bit)}
            

            self.transmission_log[i] = log_entry
                
        # self.get_details()
        self.__sift_and_compare()

    def __simulate_measurement(self, bit, prep_basis, meas_basis):
        qc = QuantumCircuit(1, 1)
        if bit == 1:
            qc.x(0)
        if prep_basis == 1:
            qc.h(0)
        if meas_basis == 1:
            qc.h(0)
        qc.measure(0, 0)
        
        # Running in simulator
        job = self.simulator.run(qc, shots=1, memory=True)
        measured_bit = int(job.result().get_memory()[0])
        return measured_bit

    def __get_details(self):
        # bases_to_char = lambda bases: np.array(['Z' if b == 0 else 'X' for b in bases])
        
        # print("--- Raw Simulation Data ---")
        # print(f"Alice's bits:  {self.alice_bits}")
        # print(f"Alice's bases: {bases_to_char(self.alice_bases)}")
        # if self.is_eve_active:
        #     print(f"Eve's bases:   {bases_to_char(self.eve_bases)}")
        #     print(f"Eve's bits:    {self.eve_bits}")
        # print(f"Bob's bases:   {bases_to_char(self.bob_bases)}")
        # print(f"Bob's bits:    {self.bob_bits}")
        # print("-" * 27)
        pass

    # def get_json_log(self):
    #     return json.dumps(self.transmission_log, indent=4)

    def __sift_and_compare(self):
        """
        Alice and Bob dicusses publicly about their Bases used and prepares sifted key
        """
        # to get indices of bits where both alice and bob used same basis
        matching_bases_indices = np.where(self.alice_bases == self.bob_bases)[0]
        unmatching_bases_indices = np.where(self.alice_bases != self.bob_bases)[0]
        
        # if len(matching_bases_indices) == 0:
        #     print("\nNo matching bases found. The final key is empty.")
        #     return

        
        max_expected_noise_bits = int(self.noise_ratio * len(matching_bases_indices)) #max noise bits in sifted key

        #FOR SIFTED KEY
        curr_flipped = 0
        for idx in matching_bases_indices:
            # print("Running") #DEBUGGING
            log_entry = self.transmission_log[idx]
            if (curr_flipped + 1) > max_expected_noise_bits:
                break
            if (np.random.random() < self.noise_ratio):
                log_entry['is_noise_flipped'] = True
                self.bob_bits[idx] = 1 - self.bob_bits[idx]
                log_entry['bob']['measured_bit'] = int(self.bob_bits[idx])
                curr_flipped += 1
        alice_sifted_key = self.alice_bits[matching_bases_indices]
        bob_sifted_key = self.bob_bits[matching_bases_indices]
        
        #FOR OTHER BITS
        curr_flipped = 0
        for idx in unmatching_bases_indices:
            log_entry = self.transmission_log[idx]
            if (curr_flipped + 1) > max_expected_noise_bits:
                break
            if (np.random.random() < self.noise_ratio):
                log_entry['is_noise_flipped'] = True
                self.bob_bits[idx] = 1 - self.bob_bits[idx]
                log_entry['bob']['measured_bit'] = int(self.bob_bits[idx])
                curr_flipped += 1
        
        # print("\n--- Key Sifting and Comparison ---")
        # print(f"Indices where bases matched: {matching_bases_indices}")
        # print(f"Alice's sifted key: {alice_sifted_key}")
        # print(f"Bob's sifted key:   {bob_sifted_key}")
        
        # Calculate Quantum Bit Error Rate (QBER)
        errors = np.sum(alice_sifted_key != bob_sifted_key)
        qber = errors / len(alice_sifted_key)
        self.qber = qber*100
        self.corrected_key = None if self.is_eve_active else list(alice_sifted_key)
        
        # print(f"\nNumber of errors: {errors} out of {len(alice_sifted_key)} bits.")
        # print(f"Quantum Bit Error Rate (QBER): {qber:.2%}")

        
        # if qber > self.noise_ratio:
        #     print("High QBER! Eavesdropper detected! Key is discarded.")
        # else:
        #     print("No errors detected. The sifted key is secure.")
        #     print("QBER is due to Noise")
        #     print("After Error correction")
        #     print(f"Final Secret Key: {alice_sifted_key}")
    def getResponse(self):
        resp = {"log_details": self.transmission_log.copy(),
               "qber": round(float(self.qber), 2),
               "corrected_key": None if self.is_eve_active else [int(key) for key in self.corrected_key] }
        return json.dumps(resp,indent = 4)
#version 3 code with transmission log


