const axios = require('axios');
const fs = require('fs');
const XLSX = require('xlsx');

const url = 'https://graph.facebook.com/v16.0/107094808850994/?fields=leadgen_forms{leads}&access_token=EAADXUjTwtRUBAJNrq1UqPpjFlgcxZBDzqEDgjbfoj8IPpleK1ZBaAf2EbtqL9SnhTXsuEVFAChqQXDq8cmuZBWxX1x7TMaaRMXfMSHUEvg8JLV5laZCxSnhn7ibJ3CLJiZAF4HLJZAVPsw5rQDXX8WzQSYh79fJDdLLTl09t5iocFlYo5mkGcV';

const getFieldShortName = (name) => {
    switch (name) {
        case 'full_name':
            return 'Name';
        case 'email':
            return 'Email';
        // Add more cases here for other fields
        default:
            return name;
    }
};

axios.get(url)
    .then(response => {
        const leadgenForms = response.data.leadgen_forms.data;
        const leads = [];

        leadgenForms.forEach(form => {
            form.leads.data.forEach(lead => {
                const leadData = {
                    created_time: lead.created_time,
                    id: lead.id,
                };

                lead.field_data.forEach(field => {
                    leadData[getFieldShortName(field.name)] = field.values[0];
                });

                leads.push(leadData);
            });
        });

        const fileName = 'facebook_leads.xlsx';
        let workbook;

        if (fs.existsSync(fileName)) {
            const existingData = XLSX.readFile(fileName);
            const existingWorksheet = existingData.Sheets[existingData.SheetNames[0]];
            const existingJson = XLSX.utils.sheet_to_json(existingWorksheet);

            const uniqueLeads = leads.filter(newLead => !existingJson.some(existingLead => existingLead.id === newLead.id));
            if (uniqueLeads.length === 0) {
                console.log('No new leads found.');
                return;
            }

            existingJson.push(...uniqueLeads);
            workbook = XLSX.utils.book_new();
            const newWorksheet = XLSX.utils.json_to_sheet(existingJson);
            XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Leads');
        } else {
            workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(leads);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
        }

        XLSX.writeFile(workbook, fileName);
        console.log('Data saved to facebook_leads.xlsx');
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
