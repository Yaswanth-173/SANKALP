// Full state/UT -> city+town dataset for the location dropdown & search
// across the app (Settings, Sidebar picker, Materials location matching).
// Not exhaustive of every municipality/village — a practical, curated list
// of major cities and important towns. Kept in sync manually with the
// equivalent copy in server/src/db/seedMaterials.js (also used there to
// generate a starter shop per location).
export const STATE_CITIES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Srikakulam', 'Vizianagaram', 'Machilipatnam', 'Tenali', 'Chittoor', 'Hindupur', 'Bhimavaram', 'Proddatur', 'Narasaraopet', 'Markapur', 'Gudivada', 'Tadipatri'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Tawang', 'Pasighat', 'Ziro', 'Bomdila', 'Tezu', 'Namsai', 'Roing', 'Aalo'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Sivasagar', 'Diphu', 'North Lakhimpur', 'Goalpara', 'Barpeta', 'Kokrajhar', 'Bongaigaon'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Bihar Sharif', 'Samastipur', 'Sasaram', 'Hajipur', 'Dehri', 'Bettiah', 'Motihari'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Raigarh', 'Jagdalpur', 'Rajnandgaon', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Kanker'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Cuncolim'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad', 'Bharuch', 'Vapi', 'Navsari', 'Mehsana', 'Morbi', 'Porbandar', 'Gandhidham', 'Bhuj', 'Palanpur', 'Godhra', 'Patan', 'Botad'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Rohtak', 'Karnal', 'Sonipat', 'Yamunanagar', 'Panchkula', 'Bhiwani', 'Sirsa', 'Rewari', 'Bahadurgarh', 'Kurukshetra', 'Kaithal'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Bilaspur', 'Hamirpur', 'Una', 'Chamba', 'Nahan', 'Palampur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Dumka', 'Phusro', 'Chaibasa', 'Medininagar'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru', 'Udupi', 'Hassan', 'Raichur', 'Vijayapura', 'Kolar', 'Mandya', 'Chikkamagaluru', 'Hospet', 'Bidar'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Idukki'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa', 'Chhindwara', 'Vidisha', 'Shivpuri', 'Morena', 'Neemuch'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati', 'Nanded', 'Sangli', 'Satara', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Chandrapur', 'Dhule', 'Ratnagiri', 'Parbhani', 'Beed', 'Wardha'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Baghmara'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Saiha'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Zunheboto'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Jharsuguda', 'Bhadrak', 'Angul', 'Dhenkanal', 'Koraput', 'Jeypore', 'Rayagada'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga', 'Batala', 'Firozpur', 'Sangrur', 'Khanna', 'Abohar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Bhilwara', 'Sikar', 'Sri Ganganagar', 'Pali', 'Barmer', 'Chittorgarh', 'Tonk', 'Bundi', 'Nagaur', 'Jaisalmer', 'Banswara'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Singtam', 'Rangpo'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Tirunelveli', 'Dindigul', 'Thanjavur', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Karur', 'Cuddalore', 'Sivakasi', 'Pudukkottai', 'Namakkal'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Mancherial', 'Jagtial', 'Kamareddy'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia', 'Ambassa', 'Kumarghat'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Mathura', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Ayodhya', 'Rampur', 'Shahjahanpur', 'Sitapur', 'Hapur', 'Unnao', 'Rae Bareli', 'Bahraich'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Nainital', 'Rudrapur', 'Kashipur', 'Almora', 'Pithoragarh', 'Mussoorie', 'Kotdwar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling', 'Kharagpur', 'Haldia', 'Bardhaman', 'Malda', 'Berhampore', 'Jalpaiguri', 'Raiganj', 'Krishnanagar'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore', 'Rajouri', 'Poonch', 'Doda', 'Kishtwar'],
  'Ladakh': ['Leh', 'Kargil'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Andaman & Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Silvassa', 'Daman', 'Diu'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Kalpeni', 'Kiltan', 'Minicoy'],
}

export const ALL_LOCATIONS = [...new Set(Object.values(STATE_CITIES).flat())].sort()
